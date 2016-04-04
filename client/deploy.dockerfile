FROM python:2.7.11

RUN pip install boto3 awscli

ADD . /workdir
WORKDIR /workdir

CMD ./deploy.cmd
