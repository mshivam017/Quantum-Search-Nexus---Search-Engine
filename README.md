# Advanced Search Engine

## Features
- Web Search
- Image Search
- News Search
- Responsive Design
- Modern UI

## Prerequisites
- Python 3.8+
- Google Cloud Account
- Google Custom Search API

## Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Google Custom Search
1. Go to Google Cloud Console
2. Enable Custom Search API
3. Create API Credentials
4. Set up Custom Search Engine

### 3. Configure Environment
Create a `.env` file with:
```
GOOGLE_API_KEY=your_api_key
GOOGLE_CSE_ID=your_search_engine_id
```

### 4. Run the Application
```bash
python app.py
```

## Technologies
- Flask
- Google Custom Search API
- Bootstrap
- JavaScript

## Limitations
- Limited free searches per day
- Requires Google API configuration
