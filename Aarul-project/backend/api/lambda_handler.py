import json
import os
import sys
import traceback
import base64
from enhanced_bedrock_backend import app

def lambda_handler(event, context):
    """
    AWS Lambda handler for the Flask application
    """
    try:
        # Import necessary modules for Lambda
        from werkzeug.serving import WSGIRequestHandler
        from werkzeug.wrappers import Request, Response
        import io
        
        # Extract HTTP method and path
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        query_string = event.get('queryStringParameters') or {}
        headers = event.get('headers', {})
        body = event.get('body', '')
        is_base64_encoded = event.get('isBase64Encoded', False)
        
        # Handle CORS preflight requests
        if http_method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                    'Access-Control-Max-Age': '86400'
                },
                'body': ''
            }
        
        # Decode base64 body if needed
        if is_base64_encoded and body:
            body = base64.b64decode(body)
        elif body and isinstance(body, str):
            body = body.encode('utf-8')
        elif not body:
            body = b''
        
        # Create WSGI environ
        environ = {
            'REQUEST_METHOD': http_method,
            'PATH_INFO': path,
            'QUERY_STRING': '&'.join([f"{k}={v}" for k, v in query_string.items()]),
            'CONTENT_TYPE': headers.get('Content-Type', headers.get('content-type', '')),
            'CONTENT_LENGTH': str(len(body)) if body else '0',
            'SERVER_NAME': 'lambda',
            'SERVER_PORT': '80',
            'wsgi.version': (1, 0),
            'wsgi.url_scheme': 'https',
            'wsgi.input': io.BytesIO(body),
            'wsgi.errors': sys.stderr,
            'wsgi.multithread': False,
            'wsgi.multiprocess': True,
            'wsgi.run_once': False,
        }
        
        # Add headers to environ
        for key, value in headers.items():
            key = key.upper().replace('-', '_')
            if key not in ('CONTENT_TYPE', 'CONTENT_LENGTH'):
                environ[f'HTTP_{key}'] = value
        
        # Capture response
        response_data = []
        status = None
        response_headers = []
        
        def start_response(status_code, headers):
            nonlocal status, response_headers
            status = status_code
            response_headers = headers
            return lambda x: response_data.append(x)
        
        # Call Flask app
        app_response = app(environ, start_response)
        
        # Collect response body
        body_parts = []
        for part in app_response:
            if isinstance(part, bytes):
                body_parts.append(part.decode('utf-8'))
            else:
                body_parts.append(str(part))
        
        response_body = ''.join(body_parts)
        
        # Parse status code
        status_code = int(status.split(' ')[0]) if status else 200
        
        # Convert headers to dict
        headers_dict = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
            'Content-Type': 'application/json'
        }
        
        for header_name, header_value in response_headers:
            headers_dict[header_name] = header_value
        
        return {
            'statusCode': status_code,
            'headers': headers_dict,
            'body': response_body,
            'isBase64Encoded': False
        }
        
    except Exception as e:
        print(f"Lambda handler error: {str(e)}")
        print(traceback.format_exc())
        
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            }),
            'isBase64Encoded': False
        }