FROM python:2.7.11

RUN apt-get -y update
RUN apt-get -y install zip
RUN pip install boto3 awscli

COPY deploy.cmd /
CMD /deploy.cmd
