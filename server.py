from flask import Flask, request, jsonify, send_from_directory
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import silhouette_score
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans

from src.fetch import get_geo_data


def optimal_k(tfidf_matrix, max_clusters=10):
    scores = []
    min_k = min(2, tfidf_matrix.shape[0])

    for k in range(min_k, min(max_clusters, tfidf_matrix.shape[0]) + 1):
        kmeans = KMeans(n_clusters=k, random_state=42)
        labels = kmeans.fit_predict(tfidf_matrix)
        score = silhouette_score(tfidf_matrix, labels)
        scores.append((k, score))

    best_k = max(scores, key=lambda x: x[1])[0]
    return best_k


def generate_cluster_data(datasets_by_pmid):
    all_descriptions = []
    pmid_mapping = []

    for pmid, descriptions in datasets_by_pmid.items():
        for desc in descriptions:
            all_descriptions.append(desc)
            pmid_mapping.append(pmid)

    if not all_descriptions:
        return None

    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(all_descriptions)

    num_clusters = optimal_k(tfidf_matrix)

    kmeans = KMeans(n_clusters=num_clusters, random_state=42)
    labels = kmeans.fit_predict(tfidf_matrix)

    pca = PCA(n_components=2)
    reduced_matrix = pca.fit_transform(tfidf_matrix.toarray())

    points = [
        {
            'x': float(reduced_matrix[i, 0]),
            'y': float(reduced_matrix[i, 1]),
            'cluster_id': int(labels[i]),
            'pmid': int(pmid_mapping[i])
        }
        for i in range(len(all_descriptions))
    ]

    return points


app = Flask(__name__, static_folder='static')


@app.route('/')
def index():
    return send_from_directory('static', 'index.html')


@app.route('/styles.css')
def styles():
    return send_from_directory('static', 'styles.css')


@app.route('/client.js')
def client_js():
    return send_from_directory('static', 'client.js')


@app.route('/run', methods=['POST'])
def run():
    data = request.get_json()
    if not isinstance(data, dict) or not isinstance(data.get('pmids'), str):
        return jsonify({'error': 'Missing "pmids" field in request'}), 400

    try:
        pmids = list(map(int, data['pmids'].split(',')))
    except ValueError:
        return jsonify({'error': 'Invalid PMIDs provided'}), 400

    if not pmids:
        return jsonify({'error': 'No valid PMIDs provided'}), 400

    datasets_by_pmid = get_geo_data(pmids)
    points = generate_cluster_data(datasets_by_pmid)

    if not points:
        return jsonify({'error': 'No relevant GEO datasets found'}), 404

    return jsonify(points)


if __name__ == '__main__':
    app.run(host='localhost', port=5000)
