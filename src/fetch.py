from collections import defaultdict
from threading import Thread
import os

import requests
import GEOparse
from GEOparse.logger import set_verbosity as geoparse_set_verbosity

if __name__ == '__main__':
    import sys
    sys.path.append('../')

from src.utils import mkpath


geoparse_set_verbosity('ERROR')

TMP_FOLDER = mkpath(os.path.dirname(os.path.abspath(__file__)), '../tmp')

for filename in os.listdir(TMP_FOLDER):
    if filename.endswith('.soft'):
        os.remove(mkpath(TMP_FOLDER, filename))


def download_geo_dataset(geo_id: str, pmids: list[int], output: dict[int, list[str]]):
    # print(f'Downloading GEO dataset {geo_id}...')
    r = requests.get(f'https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc={geo_id}&targ=self&form=text&view=brief')
    if r.status_code != 200:
        print(f'ERROR: downloading GEO dataset {geo_id}')
        return

    with open(mkpath(TMP_FOLDER, f'{geo_id}.soft'), 'w', encoding='utf-8') as file:
        file.write(r.text)

    gse = GEOparse.get_GEO(filepath=mkpath(TMP_FOLDER, f'{geo_id}.soft'))
    try:
        for pmid in pmids:
            output[pmid].append(' '.join((
                gse.metadata['title'][0],
                gse.metadata['type'][0],
                gse.metadata['summary'][0],
                gse.metadata['sample_organism'][0],
                gse.metadata['overall_design'][0]
            )))
    except Exception as e:
        print(f'Error parsing GEO dataset {geo_id}: {e}')
    finally:
        os.remove(mkpath(TMP_FOLDER, f'{geo_id}.soft'))


def get_geo_data(pmids: list[int]) -> dict[int, list[str]]:
    datasets_by_pmid: dict[int, list[str]] = defaultdict(list)

    print(f'Requesting GEO dataset IDs for {len(pmids)} PMIDs...')
    linksets = requests.post(
        'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi',  # Main boottleneck: ~7 seconds for 90 PMIDs
        data={
            'dbfrom': 'pubmed',
            'db': 'gds',
            'linkname': 'pubmed_gds',
            'id': pmids,
            'retmode': 'json'
        }
    ).json()['linksets']

    print('Parsing GEO dataset IDs...')

    geo_id_to_pmids = defaultdict(list)

    for item in linksets:
        if len(item['ids']) != 1:
            print(f'WARNING: Unexpected number of IDs in linkset: {item}')

        pmid = int(item['ids'][0])

        for dataset_id in map(int, item['linksetdbs'][0]['links']):

            # There's only one case in the test list of PMIDs when this does not work:
            # it wants me to download tar.gz — I skipped it for now
            # I should have done it by fetching
            # https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gds&id={dataset_id}&retmode=json
            # But this takes extra processing time
            if not str(dataset_id).startswith('200'):
                continue

            geo_id = 'GSE' + str(dataset_id)[1:].lstrip('0')
            geo_id_to_pmids[geo_id].append(pmid)

    print('Downloading GEO datasets...')
    threads = []
    for geo_id, pmids in geo_id_to_pmids.items():
        t = Thread(target=download_geo_dataset, args=(geo_id, pmids, datasets_by_pmid))
        t.start()
        threads.append(t)

    for t in threads:
        t.join()

    return datasets_by_pmid


# Quick tests
if __name__ == '__main__':
    with open('../tests/PMIDs_list.txt') as file:
        pmids = list(map(int, file))

    get_geo_data(pmids)
