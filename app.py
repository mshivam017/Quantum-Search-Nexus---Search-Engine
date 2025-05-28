import os
import logging
from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('search_engine.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class GoogleSearchEngine:
    def __init__(self):
        """
        Initialize Google Custom Search Engine with advanced configuration
        """
        self.api_key = os.getenv('GOOGLE_API_KEY')
        self.cse_id = os.getenv('GOOGLE_CSE_ID')
        
        if not self.api_key or not self.cse_id:
            logger.critical("CRITICAL: Missing Google API credentials!")
            raise ValueError("Google API Key or Custom Search Engine ID not found in environment variables")
        
        try:
            # Build service with more robust configuration
            self.service = build("customsearch", "v1", developerKey=self.api_key)
            
            # Validate API credentials
            # If quota is exceeded, we'll still allow the application to start
            # but searches will likely fail
            credential_status = self._validate_credentials()
            
            if not credential_status:
                logger.warning("Google Custom Search API quota exceeded. Searches may fail.")
        
        except Exception as e:
            logger.error(f"Failed to initialize Google Custom Search: {e}")
            raise

    def _validate_credentials(self):
        """
        Validate Google Custom Search API credentials
        """
        try:
            # Perform a test search to validate credentials
            test_result = self.service.cse().list(
                q='test',  # Minimal test query
                cx=self.cse_id, 
                num=1
            ).execute()
            
            logger.info("Google Custom Search API credentials validated successfully")
        except HttpError as e:
            # Handle specific HTTP errors
            error_details = e.resp.reason if hasattr(e.resp, 'reason') else str(e)
            
            if 'quotaExceeded' in str(e) or 'rateLimitExceeded' in str(e):
                logger.warning(f"Daily Google Custom Search API quota exceeded: {error_details}")
                # Instead of raising an error, log a warning and continue
                return False
            
            logger.critical(f"API Credential Validation Failed: {error_details}")
            raise ValueError(f"Invalid Google Custom Search credentials: {error_details}")
        
        except Exception as e:
            logger.critical(f"Unexpected error during API credential validation: {e}")
            raise ValueError(f"Unexpected error validating Google Custom Search credentials: {e}")
        
        return True

    def search(self, query, search_type='web', num_results=10):
        """
        Comprehensive search method with advanced error handling and logging
        
        :param query: Search query string
        :param search_type: Type of search (web/images/news)
        :param num_results: Number of results to retrieve
        :return: List of search results
        """
        # Input validation and sanitization
        query = self._sanitize_query(query)
        
        try:
            # Validate search type
            if search_type not in ['web', 'images', 'news']:
                logger.warning(f"Invalid search type: {search_type}. Defaulting to web.")
                search_type = 'web'

            # Perform search based on type with enhanced configuration
            search_methods = {
                'web': self._web_search,
                'images': self._image_search,
                'news': self._news_search
            }

            # Execute appropriate search method
            results = search_methods.get(search_type, self._web_search)(query, num_results)
            
            # Log search performance
            logger.info(f"{search_type.capitalize()} Search: '{query}' returned {len(results)} results")
            
            return results

        except Exception as e:
            # Comprehensive error handling
            logger.error(f"Search error for query '{query}': {e}")
            return [{
                'title': 'Search Error',
                'snippet': f"Unable to complete {search_type} search: {str(e)}",
                'link': '#',
                'source': 'Google Custom Search',
                'api_status': 'Error'
            }]

    def _sanitize_query(self, query):
        """
        Sanitize and validate search query
        """
        # Remove potentially harmful characters
        import re
        query = re.sub(r'[^\w\s-]', '', query)
        
        # Truncate extremely long queries
        query = query[:100]
        
        # Convert to lowercase for consistency
        query = query.lower().strip()
        
        return query

    def _web_search(self, query, num_results=10):
        """
        Advanced web search using Google Custom Search API
        """
        try:
            # Enhanced search parameters
            search_params = {
                'q': query, 
                'cx': self.cse_id, 
                'num': min(num_results, 10),  # Google CSE max is 10
                'safe': 'active',  # Enable safe search
                'fields': 'items(title,link,snippet,displayLink,pagemap)'
            }

            # Execute search with comprehensive error handling
            result = self.service.cse().list(**search_params).execute()

            # Process and normalize results
            search_results = []
            for item in result.get('items', []):
                result_item = {
                    'title': item.get('title', 'No Title'),
                    'link': item.get('link', '#'),
                    'snippet': item.get('snippet', 'No description available')[:300],
                    'source': 'Google Custom Search',
                    'metadata': {
                        'displayLink': item.get('displayLink', ''),
                        'pagemap': item.get('pagemap', {})
                    },
                    'api_status': 'Success'
                }
                search_results.append(result_item)

            return search_results

        except Exception as e:
            logger.error(f"Web search error: {e}")
            return [{
                'title': 'Web Search Error',
                'snippet': str(e),
                'link': '#',
                'source': 'Google Custom Search',
                'api_status': 'Error'
            }]

    def _image_search(self, query, num_results=10):
        """
        Advanced image search using Google Custom Search API
        """
        try:
            # Enhanced image search parameters
            search_params = {
                'q': query, 
                'cx': self.cse_id, 
                'num': min(num_results, 10),  # Google CSE max is 10
                'searchType': 'image',
                'safe': 'active',  # Enable safe search
                'fields': 'items(title,link,image,displayLink)'
            }

            # Execute image search
            result = self.service.cse().list(**search_params).execute()

            # Process and normalize image results
            image_results = []
            for item in result.get('items', []):
                result_item = {
                    'title': item.get('title', 'No Title'),
                    'link': item.get('link', '#'),
                    'image': {
                        'thumbnailLink': item.get('image', {}).get('thumbnailLink', ''),
                        'contextLink': item.get('image', {}).get('contextLink', ''),
                        'width': item.get('image', {}).get('width', 0),
                        'height': item.get('image', {}).get('height', 0)
                    },
                    'source': 'Google Custom Search',
                    'metadata': {
                        'displayLink': item.get('displayLink', '')
                    },
                    'api_status': 'Success'
                }
                image_results.append(result_item)

            return image_results

        except Exception as e:
            logger.error(f"Image search error: {e}")
            return [{
                'title': 'Image Search Error',
                'snippet': str(e),
                'link': '#',
                'source': 'Google Custom Search',
                'api_status': 'Error'
            }]

    def _news_search(self, query, num_results=10):
        """
        Advanced news search using Google Custom Search API
        """
        try:
            # Enhanced news search parameters
            search_params = {
                'q': query, 
                'cx': self.cse_id, 
                'num': min(num_results, 10),  # Google CSE max is 10
                'safe': 'active',  # Enable safe search
                'fields': 'items(title,link,snippet,displayLink,pagemap)'
            }

            # Execute news search
            result = self.service.cse().list(**search_params).execute()

            # Process and normalize news results
            news_results = []
            for item in result.get('items', []):
                result_item = {
                    'title': item.get('title', 'No Title'),
                    'link': item.get('link', '#'),
                    'snippet': item.get('snippet', 'No description available')[:300],
                    'source': 'Google Custom Search',
                    'metadata': {
                        'displayLink': item.get('displayLink', ''),
                        'pagemap': item.get('pagemap', {})
                    },
                    'api_status': 'Success'
                }
                news_results.append(result_item)

            return news_results

        except Exception as e:
            logger.error(f"News search error: {e}")
            return [{
                'title': 'News Search Error',
                'snippet': str(e),
                'link': '#',
                'source': 'Google Custom Search',
                'api_status': 'Error'
            }]

# Flask Application Setup
app = Flask(__name__, 
            template_folder='templates', 
            static_folder='static')
CORS(app)

# Initialize Search Engine
search_engine = GoogleSearchEngine()

@app.route('/')
def index():
    """
    Render main search page
    """
    return render_template('index.html')

@app.route('/search', methods=['GET'])
def search():
    """
    Handle search requests with comprehensive error handling
    """
    query = request.args.get('q', '')
    search_type = request.args.get('type', 'web')
    
    try:
        num_results = int(request.args.get('num', 10))
    except ValueError:
        num_results = 10

    if not query:
        return jsonify([{
            'title': 'Search Error',
            'snippet': 'Please provide a search query',
            'link': '#',
            'source': 'Search Engine',
            'api_status': 'Error'
        }]), 400

    try:
        results = search_engine.search(query, search_type, num_results)
        
        # If no results, return a specific message
        if not results:
            results = [{
                'title': f'No results for "{query}"',
                'snippet': 'Unable to find any matching results.',
                'link': '#',
                'source': 'Search Engine',
                'api_status': 'No Results'
            }]
        
        return jsonify(results)

    except Exception as e:
        logger.error(f"Search request error: {e}")
        return jsonify([{
            'title': 'Search Error',
            'snippet': str(e),
            'link': '#',
            'source': 'Search Engine',
            'api_status': 'Error'
        }]), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
