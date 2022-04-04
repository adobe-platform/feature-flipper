FROM python:3.9.12

RUN apt-get -y update
RUN apt-get -y install zip
RUN pip install boto3 awscli

COPY deploy.cmd /
CMD /deploy.cmd
