FROM python:3.12-slim

# Set up user permissions for Hugging Face container constraints
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH
WORKDIR $HOME/app

# Copy and install dependencies
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application files
COPY --chown=user . .

# Hugging Face Spaces mandates port 7860
EXPOSE 7860

# Run using production Gunicorn binding to port 7860
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "app:app"]