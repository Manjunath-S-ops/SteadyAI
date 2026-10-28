FROM apache/airflow:2.8.1-python3.10

USER root

# Install any system dependencies
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
         build-essential \
  && apt-get autoremove -yqq --purge \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

USER airflow

# Copy requirements and install
COPY requirements.txt /requirements.txt
RUN pip install --no-cache-dir -r /requirements.txt

# Copy DAGs and source code
COPY dags /opt/airflow/dags
COPY src /opt/airflow/src
