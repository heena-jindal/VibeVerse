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

# Render web services default to port 10000; keep one worker so the service
# stays within the memory limit of the small instance.
ENV PORT=10000
EXPOSE 10000

# Runtime configuration (DATABASE_URL, GROQ_API_KEY, SECRET_KEY, FRONTEND_URL)
# is supplied through the container environment and read by app.py.
CMD ["sh", "-c", "exec gunicorn --workers 1 --threads 2 --timeout 120 --bind 0.0.0.0:${PORT:-10000} app:app"]
