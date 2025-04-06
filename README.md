<h1 align="center">PubTrends: Scientific Paper Clustering</h1>

## Installation

1. Clone the repository
2. Install Python 3 modules:
	```sh
	pip install -r requirements.txt
	```

## Usage

1. Run the server:
	```sh
	python3 server.py
	```
2. Open the client in a browser: http://localhost:5000
3. Paste PMIDs in the text box and click `Run` (You can use [the PMIDs given in the task statement](tests/PMIDs_list.txt))
4. Wait ~10-17 seconds

## Other technical details

Code quality is ensured through:
- `flake8` (with multiple plugins) — the most common linter for Python
- `mypy` — a static type checker enforcing strong typing

These code quality checks are automatically run via GitHub Actions on each push: <a href="https://github.com/npanuhin/edu-JetBrains-PubMed/actions"><img src="https://github.com/npanuhin/edu-JetBrains-PubMed/actions/workflows/python-lint.yml/badge.svg"></a>
