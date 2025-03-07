from flask import Flask, request, send_file, send_from_directory
import matplotlib.pyplot as plt

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA

from src.fetch import get_geo_data


def generate_clusters(datasets_by_pmid):
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

    num_clusters = min(len(all_descriptions), 5)
    kmeans = KMeans(n_clusters=num_clusters, random_state=42)
    labels = kmeans.fit_predict(tfidf_matrix)

    pca = PCA(n_components=2)
    reduced_matrix = pca.fit_transform(tfidf_matrix.toarray())

    plt.figure(figsize=(12, 8))
    scatter = plt.scatter(
        reduced_matrix[:, 0],
        reduced_matrix[:, 1],
        c=labels,
        cmap='viridis',
        edgecolors='k',
        alpha=0.7
    )

    for i, pmid in enumerate(pmid_mapping):
        plt.annotate(str(pmid), (reduced_matrix[i, 0], reduced_matrix[i, 1]), fontsize=7, alpha=0.7)

    plt.title('Clusters of GEO Datasets based on TF-IDF')
    plt.xlabel('PCA Component 1')
    plt.ylabel('PCA Component 2')
    cbar = plt.colorbar(scatter)
    cbar.set_label('Cluster Label')

    img_path = 'clusters.png'
    plt.savefig(img_path)
    plt.close()
    return img_path


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
        return {'error': 'Missing "pmids" field in request'}, 400

    try:
        pmids = list(map(int, data['pmids'].split(',')))
    except ValueError:
        return {"error": "Invalid PMIDs provided"}, 400

    if not pmids:
        return {"error": "No valid PMIDs provided"}, 400

    datasets_by_pmid = get_geo_data(pmids)
    img_path = generate_clusters(datasets_by_pmid)

    if not img_path:
        return {'error': 'No relevant GEO datasets found'}, 404

    return send_file(img_path, mimetype='image/png')


if __name__ == '__main__':
    app.run(host='localhost', port=5000)
