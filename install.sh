yarn global add pm2
git clone https://github.com/UNF0X/StaterBackend
cd StaterBackend && yarn
pm2 --name Monify start node -- index.js -- "$1"
pm2 save
pm2 logs Monify --lines 100
echo "Successfully installed."
