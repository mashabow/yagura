# yagura

## 初期設定

1. [Firebase コンソール](https://console.firebase.google.com/)から、新規プロジェクトを作成する

1. ⚙️ > プロジェクトを設定 > 全般 のページに移動し、デフォルトのリソースロケーションを `asia-northeast1`（東京）に設定する

1. ⚙️ > 使用量と請求額 > 詳細と設定 のページに移動し、料金プランを Spark（無料）から Blaze（従量制）に変更する

1. 開発 > Database のページに移動し、Cloud Firestore データベースを作成する

1. [Firebase CLI](https://firebase.google.com/docs/cli) をインストールする

   ```console
   $ npm install -g firebase-tools
   ```

1. 作成したプロジェクトを選択し、適当なエイリアス名を設定する

   ```console
   $ firebase use --add
   ```

1. Slack の [Incoming Webhook](https://api.slack.com/messaging/webhooks) URL を用意し、Functions の `slack.webhook_url` に設定する

   ```console
   $ firebase functions:config:set slack.webhook_url="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
   ```

1. Firebase にデプロイ 🚀

   ```console
   $ firebase deploy
   ```
