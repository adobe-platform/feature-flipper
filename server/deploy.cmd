#!/bin/bash -e

python deploy.py

make create_functions &>/dev/null
make upload_functions

cd public
python deploy.py

cd ..

cd private
python deploy.py
