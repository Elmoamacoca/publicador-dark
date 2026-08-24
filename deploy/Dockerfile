FROM python:3.12-slim
WORKDIR /app
COPY painel/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY painel/ /app/
ENV PAINEL_ENDERECO=0.0.0.0
EXPOSE 4173
CMD ["python", "servidor.py"]
