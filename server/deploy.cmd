#!/bin/bash -e

make upload_functions

cd private
python deploy.py

cd ..

cd public
python deploy.py
