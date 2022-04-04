#!/bin/bash -e

rm -fr /host/virtualenv
mkdir /host/virtualenv
mkdir ve
virtualenv ve
source ve/bin/activate
pip install msgpack-python
cp -R /ve/lib/python3.9/site-packages/* /host/virtualenv
