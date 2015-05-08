#!/bin/python2
# Script that replies to username mentions.
import praw
from praw.handlers import MultiprocessHandler
handler = MultiprocessHandler()

import time
import os
import cPickle
import sys
import traceback

from urlparse import urlparse
from pprint import pprint
from PIL import Image, ImageStat

import gabenizer

KEY_PHRASE = 'have at you'

REDDIT_USER = os.environ['REDDIT_USER']
REDDIT_PASSWORD = os.environ['REDDIT_PASSWORD']
URL_STATIC = os.environ['URL_STATIC']

donefile = os.path.join(os.environ['OPENSHIFT_DATA_DIR'],'processed_mentions.p')
already_done = set()
try:
    already_done = cPickle.load(open(donefile, 'rb'))
except:
    pass

r = praw.Reddit('gabenizer bot', handler=handler)
r.login(REDDIT_USER, REDDIT_PASSWORD)

mentions = r.get_mentions()

for mention in mentions:
    if mention.submission.url in already_done:
        continue
    already_done.add(mention.submission.url)

    if not KEY_PHRASE in mention.body.lower():
        continue

    # get only valid images
    url = ''
    parsed_url = urlparse(mention.submission.url)
    if parsed_url.netloc == 'imgur.com':
        # is album or framed page
        if parsed_url.path.split('/')[1]=='a':
            # is album, skip
            continue
        else:
            url = parsed_url.geturl()+'.jpg'
    elif parsed_url.netloc == 'i.imgur.com':
        # is image file
        url = parsed_url.geturl()
    print url

    if url == '':
        continue

    try:
        image = gabenizer.process_image(url, os.path.join(os.environ['OPENSHIFT_REPO_DIR'], 'gabenface.png'))
        filename = str(time.time())+'gabenized.png'
        imgururl = gabenizer.imgur_upload(image, os.path.join(os.environ['OPENSHIFT_DATA_DIR'], 'pics'), filename, title, URL_STATIC)

        # comment link
        mention.submission.add_comment("[Praise be Gaben.](%s)\n\n***\n\nI am a bot. [More?](www.reddit.com/r/gentlemangabers) [Github](https://github.com/revan/gabenizer)" % imgururl)

    except:
        traceback.print_exc()
        continue

# save list of processed URLs to disk
cPickle.dump(already_done, open(donefile, 'wb'))
