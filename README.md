# yagura

## 初期設定

### Firebase プロジェクトの作成

1. [Firebase コンソール](https://console.firebase.google.com/)から、新規プロジェクトを作成

1. ⚙️ > プロジェクトを設定 > 全般 のページに移動し、デフォルトのリソースロケーションを `asia-northeast1`（東京）に設定

1. ⚙️ > 使用量と請求額 > 詳細と設定 のページに移動し、料金プランを Spark（無料）から Blaze（従量制）に変更

1. 開発 > Database のページに移動し、Cloud Firestore データベースを作成

1. [Firebase CLI](https://firebase.google.com/docs/cli) をインストール

   ```console
   $ npm install -g firebase-tools
   ```

1. 作成したプロジェクトを選択し、適当なエイリアス名を設定

   ```console
   $ firebase use --add
   ```

### Slack アプリの作成

1. [Bolt 入門ガイド](https://slack.dev/bolt-js/ja-jp/tutorial/getting-started) の「[アプリを作成する](https://slack.dev/bolt-js/ja-jp/tutorial/getting-started#%E3%82%A2%E3%83%97%E3%83%AA%E3%82%92%E4%BD%9C%E6%88%90%E3%81%99%E3%82%8B)」を参考にして、Slack アプリを作成

   1. [アプリ作成ページ](https://api.slack.com/apps?new_app=1) に移動
   1. 適当なアプリ名と、インストールが先のワークスペースを入力し、アプリを作成
   1. Basic Information > Signing Secret の値をメモしておく

1. 「[トークンとアプリのインストール](https://slack.dev/bolt-js/ja-jp/tutorial/getting-started#%E3%83%88%E3%83%BC%E3%82%AF%E3%83%B3%E3%81%A8%E3%82%A2%E3%83%97%E3%83%AA%E3%81%AE%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB)」を参考にして、OAuth & Permissions を設定

   1. Scopes > Bot Token Scopes に `channels:history` と `chat:write` を追加
   1. OAuth Tokens & Redirect URLs の [Install App to Workspace] ボタンをクリックして、インストール
   1. インストールが完了すると Bot User OAuth Access Token が表示されるので、それをメモしておく

### Firebase へのデプロイ

1. Slack アプリの Signing Secret を、Firebase Functions の `slack.signing_secret` に設定

   ```console
   $ firebase functions:config:set slack.signing_secret="01234567890abcdef..."
   ```

1. Slack アプリの Bot User OAuth Access Token を、Firebase Functions の `slack.bot_token` に設定

   ```console
   $ firebase functions:config:set slack.bot_token="xoxb-0123456789..."
   ```

1. Firebase にデプロイ 🚀

   ```console
   $ firebase deploy
   ```

### Slack アプリの追加設定

1. 「[イベントの設定](https://slack.dev/bolt-js/ja-jp/tutorial/getting-started#%E3%82%A4%E3%83%99%E3%83%B3%E3%83%88%E3%81%AE%E8%A8%AD%E5%AE%9A)」を参考にして Event Subscriptions を有効化

   1. Enable Events を On に変更
   1. Request URL に `https://asia-northeast1-<FirebaseのプロジェクトID>.cloudfunctions.net/slack/events` と入力
   1. Subscribe to bot events で `message.channels` を選択
   1. 設定を保存

1. 「[アクションの送信と応答](https://slack.dev/bolt-js/ja-jp/tutorial/getting-started#%E3%82%A2%E3%82%AF%E3%82%B7%E3%83%A7%E3%83%B3%E3%81%AE%E9%80%81%E4%BF%A1%E3%81%A8%E5%BF%9C%E7%AD%94)」を参考にして Interactivity を有効化

   1. Interactivity & Shortcuts の Interactivity を On に変更
   1. Request URL に `https://asia-northeast1-<FirebaseのプロジェクトID>.cloudfunctions.net/slack/events` と入力（前項と同じ URL）
   1. 設定を保存

1. Slack アプリの bot ユーザーを、投稿先のチャンネルに invite
