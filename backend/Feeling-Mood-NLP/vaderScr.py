from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import sys
import json


analyzer = SentimentIntensityAnalyzer()


def calculate_intensity_vader(journal_text):
   
    #we get the sentiment scores here
    sentiment_scores = analyzer.polarity_scores(journal_text)
    
    # Valence score (compound score range is from -1 (most negative) to 1 (most positive))
    feeling = sentiment_scores['compound']
    positive_score = sentiment_scores['pos']
    negative_score = sentiment_scores['neg']
    intensity = positive_score - negative_score
    
    return [feeling, intensity]

#This is where script is executed
if __name__ == "__main__":
 
    input_json = sys.stdin.read()
    journals = json.loads(input_json)

  
    results = []
    feelingSum = 0
    intensitySum = 0
    count = 0
    for journal in journals:
        feeling, intensity = calculate_intensity_vader(journal)
        feelingSum = feelingSum + feeling
        intensitySum = intensitySum + intensity
        count = count +1
    
    feelingAvg = feelingSum/count
    intAvg =intensitySum/count
    
    results.append({"feeling": feelingAvg, "intensity": intAvg})
    
  
    print(json.dumps(results))