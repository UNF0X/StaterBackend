curl -fsSL https://deb.nodesource.com/setup_current.x | sudo -E bash -
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo gpg --dearmor -o /usr/share/keyrings/yarn-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/yarn-archive-keyring.gpg] https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update && sudo apt install yarn nodejs git
yarn global add pm2
git clone https://github.com/UNF0X/StaterBackend
cd StaterBackend && yarn
pm2 --name Monify start node -- index.js -- "$1"
pm2 save
pm2 logs Monify --lines 100
echo "Successfully installed."
