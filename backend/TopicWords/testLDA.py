#!/path/to/python3.11
import sys


import lda
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
import sys
import json

def perform_lda(journals):
    vectorizer = CountVectorizer(stop_words='english')
    X = vectorizer.fit_transform(journals)
    vocab = np.array(vectorizer.get_feature_names_out())

    num_topics = 3
    model = lda.LDA(n_topics=num_topics, n_iter=1500, random_state=1)
    model.fit(X)

    topic_word = model.topic_word_
    n_top_words = 5

    topics = []

    for i, topic_dist in enumerate(topic_word):
        topic_words = vocab[np.argsort(topic_dist)][:-(n_top_words+1):-1]
        topics.append(topic_words.tolist())

    return topics

if __name__ == "__main__":
    input_json = sys.stdin.read()
    journals = json.loads(input_json)

    result = perform_lda(journals)

    print(json.dumps(result))