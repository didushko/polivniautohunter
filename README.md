# PolovniAutoHunter

## Try the Bot

You can test the working version of the bot here: [PolovniAutoHunter](https://t.me/polovniAutoHunter_bot)

## Project Purpose

This Telegram bot was created to help my friend search for cars on [Polovniautomobili](https://www.polovniautomobili.com/).  
I aimed to make it versatile so that others can use it as well.

With this bot, you can add links to your searches, and it will send you Telegram notifications with updates for your searches.

## How to Run Locally

### Prerequisites

1. Create new bot using [BotFather](https://t.me/BotFather). Save the token provided, as it will be used in environment variables or the `.env` file.
2. You will need a MongoDB database.

### Steps

1. Clone the repository:

   ```bash
    git clone https://github.com/didushko/polivniautohunter.git
   ```

2. Navigate into the project directory:
   ```bash
    cd polovniAutoHunter
   ```
3. Add the following environment variables or create a .env file in the root directory with these values:

   ```bash
   TOKEN=bot_token # Replace "bot_token" with the token from step 1 in the prerequisites.
   INTERVAL=30     # Replace "30" with the desired interval for updating requests and sending notifications (in minutes).
   DB_PASSWORD=db_password # Replace "db_password" with your database password.
   DB_USER=db_user         # Replace "db_user" with your database username.
   DB_NAME=db_name         # Replace "db_name" with your database name.
   ADMIN_ID=admin_id       # Replace "admin_id" with your Telegram ID if you want to use admin features like support messages.
   ```

4. Install dependencies:

   ```bash
    npm install

   ```

5. Run:
   ```bash
    npm start
   ```
