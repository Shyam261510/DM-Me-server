FROM oven/bun:1.3.5

WORKDIR /app

# Install ffmpeg
RUN apt-get update \
  && apt-get install -y ffmpeg \
  && rm -rf /var/lib/apt/lists/*

# 1 Copy only dependency files first

COPY package.json package.json
COPY bun.lock bun.lock

# 2️ Install dependencies 


RUN bun install

ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}



# 3️ Copy rest of the source code

COPY . .

# 4 Running the bunx prisma generate command

RUN bunx prisma generate

EXPOSE 8000
# 5 RUN command

CMD ["bun","run", "dev:all"]
