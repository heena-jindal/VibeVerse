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

# Match the port used by app.py
EXPOSE 5000

# Runtime configuration (DATABASE_URL, GROQ_API_KEY, SECRET_KEY, FRONTEND_URL)
# is supplied through the container environment and read by app.py.
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
