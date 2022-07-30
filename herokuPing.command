while true; do

    sleep 30 &

    heroku logs -a openseadealsbot

    wait
done