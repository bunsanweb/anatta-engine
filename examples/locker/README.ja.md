# 概要

公開鍵認証を用いて、アクセス制限を行なう例。

# 構成

以下の二つのagentで構成される。

* person
    * 秘密鍵/公開鍵のペアを起動時に生成し、保持する
        * 公開鍵は公開することができる
    * 公開鍵を登録したhouseに公開鍵を登録することができる
    * 公開鍵を登録したhouseにメッセージを書き込むことができる
    * houseに書き込まれたメッセージを取得することができる
* house
    * 起動時に管理者personの公開鍵を登録する
    * 公開鍵を登録したpersonがPOSTした公開鍵を受け取り登録する
    * 公開鍵を登録したpersonがPOSTしたメッセージでメッセージを更新する
    * メッセージを公開する

# personの役割

* 最初のperson
    * 管理者としてhouseを起動する
    * house起動直後、唯一の書き込み権限を持つ
        * 任意の公開鍵を登録することができる
            * 他のpersonの公開鍵を登録することで、他のpersonに書き込み権限を与えることができる
        * メッセージを更新することができる
* 任意のhouseにおける管理者以外のperson(管理者の別ペルソナ, 他人, 等々)
    * 管理者が公開鍵を登録するまで、houseに対する書き込み権限を持たない
        * houseの情報を読む(取得する)ことはできるが、更新することはできない

# 利用方法
## 管理者personと、houseの起動

* 管理者personを起動する
    * [ADMIN_PORT]を省略した場合は8001を用いる

<pre>
$ cd person
$ node run.js [ADMIN_PORT]
</pre>

* ブラウザを用いて http://localhost:[ADMIN_PORT] を開く
    * 秘密鍵/公開鍵ペアが生成される

* houseを起動する
    * [HOUSE_PORT]は省略することができない
    * [ADMIN_PUBKEY_URI]は http://localhost:[ADMIN_PORT]/pubkey である

<pre>
$ cd house
$ node run.js [HOUSE_PORT] [ADMIN_PUBKEY_URI]
</pre>

* 管理者personにhouseのURIを登録する
    * ブラウザを用いて http://localhost:[ADMIN_PORT] を開く
    * "house" の下のテキスト入力フィールドにhouseのURIを入力した後、registerボタンをクリックする
        * houseのURIは https://localhost:[HOUSE_PORT] である
        * httpではなく、httpsであることに注意する

* 管理者personからhouseのメッセージを更新する
    * ブラウザを用いて http://localhost:[ADMIN_PORT] を開く
    * link以下にあるmessageをクリックして、メッセージ入力ページに遷移する
    * テキストエリアに適当な文字列を入力した後、refreshボタンをクリックするとhouseのメッセージが更新される

## 管理者ではないpersonの公開鍵をhouseに登録して、書き込み権限を与える

* 新規personを起動する
    * [PERSON_PORT]は[ADMIN_PORT]と異なるものを用いる

<pre>
$ cd person
$ node run.js [PERSON_PORT]
</pre>

* 新規personにhouseのURIを登録する
    * ブラウザを用いて http://localhost:[PERSON_PORT] を開く
    * "house" の下のテキスト入力フィールドにhouseのURIを入力した後、registerボタンをクリックする
        * houseのURIは https://localhost:[HOUSE_PORT] である
        * httpではなく、httpsであることに注意する

* 新規personからhouseのメッセージを更新を試みる
    * ブラウザを用いて http://localhost:[ADMIN_PORT] を開く
    * link以下にあるmessageをクリックして、メッセージ入力ページに遷移する
    * テキストエリアに適当な文字列を入力した後、refreshボタンをクリックしてもhouseのメッセージが更新されないことを確認する

* 管理者personが新規personの公開鍵をhouseに登録して、書き込み権限を与える
    * ブラウザを用いて http://localhost:[PERSON_PORT]/pubkey を開き、表示された新規personの公開鍵をコピーする
    * ブラウザを用いて http://localhost:[ADMIN_PORT] を開き、"publickey"の下のテキストエリアにコピーした公開鍵をペーストした後、addボタンをクリックすると新規personの公開鍵がhouseに登録される
        * ブラウザによっては最後の改行がコピー(ペースト)されないことがあるので注意する

* 新規personからhouseのメッセージを更新する
    * ブラウザを用いて http://localhost:[ADMIN_PORT] を開く
    * link以下にあるmessageをクリックして、メッセージ入力ページに遷移する
    * テキストエリアに適当な文字列を入力した後、refreshボタンをクリックするとhouseのメッセージが更新される

