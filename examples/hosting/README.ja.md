# 概要

既に動いているagentに、任意のagentを動的に追加して使用する例。

# 構成

以下の二つのagentで構成される。

* host
    * 任意のagentを動的に追加して使用するagent
* store
    * 追加するagentを提供するagent

# 利用方法

* storeを起動する
    * [STORE_PORT]を省略した場合は8001を用いる

<pre>
$ cd store
$ node run.js [STORE_PORT]
</pre>

* hostを起動する
    * [HOST_PORT]を省略した場合は8000を用いる

<pre>
$ cd host
$ node run.js [HOST_PORT]
</pre>

* ブラウザを用いて http://localhost:[STORE_PORT] を開く
    * insts 以下に fileuploader, wiki, wall という三つのinst(動的に追加するagent)へのリンクが存在しているので、hostに追加したいinstのURIをコピーする

* ブラウザを用いて http://localhost:[HOST_PORT] を開く
    * テキスト入力フィールドに先ほどコピーしたinstのURIをペーストした後、addボタンをクリックする
    * "my insts" 以下に追加したinstのUIへのリンクが表われるので、クリックしてUIへ遷移することでinstを使用することができる
