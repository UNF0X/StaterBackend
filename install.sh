sudo npm i -g pm2
git clone https://github.com/UNF0X/StaterBackend /usr/sbin/StaterBackend
cd /usr/sbin/StaterBackend && yarn
pm2 --name Monify start node -- /usr/sbin/StaterBackend/index.js
pm2 save
pm2 logs Monify --lines 100
echo "Successfully installed."
