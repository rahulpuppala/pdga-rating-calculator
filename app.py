from flask import Flask, render_template, request, jsonify
from datetime import datetime
import os

app = Flask(__name__)

# PDGA rating calculation constants
MIN_ROUNDS_FOR_RATING = 8
MAX_ROUNDS_FOR_RATING = 24

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.get_json()
    rounds = data.get('rounds', [])
    
    if not rounds:
        return jsonify({
            'success': False,
            'error': 'No rounds provided'
        }), 400
    
    # Sort rounds by rating (descending)
    sorted_rounds = sorted(rounds, key=lambda x: x['rating'], reverse=True)
    
    # Calculate rating based on PDGA algorithm (simplified)
    num_rounds = len(sorted_rounds)
    
    if num_rounds < MIN_ROUNDS_FOR_RATING:
        # Not enough rounds for an official rating
        avg_rating = sum(round['rating'] for round in sorted_rounds) / num_rounds
        is_official = False
    else:
        # Use top 25% of rounds (PDGA method)
        top_rounds = sorted_rounds[:max(8, num_rounds // 4)]
        avg_rating = sum(round['rating'] for round in top_rounds) / len(top_rounds)
        is_official = True
    
    return jsonify({
        'success': True,
        'calculated_rating': round(avg_rating, 2),
        'rounds_used': num_rounds,
        'is_official': is_official,
        'min_rounds_needed': max(0, MIN_ROUNDS_FOR_RATING - num_rounds) if num_rounds < MIN_ROUNDS_FOR_RATING else 0
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)
