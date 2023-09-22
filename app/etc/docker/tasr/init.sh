#!/bin/sh
stty rows 24 cols 80 mitmdump -p 48088 --mode reverse:http://tmg-local-tasr:8088/
echo "*** runinng update & install curl ***"
apt-get update
apt-get upgrade
apt-get install -y curl
curl --version
echo "*** populating tasr data for s_tmg_test_1 ***"
nohup python /tasr/src/py/tasr/app/standalone.py --env sandbox --host 0.0.0.0 --port 80 --redis_host $SANDBOX_REDIS_HOST --redis_port 6379 &
ps aux
sleep 10
# populate tasr
# create the 's_tmg_test_1' subject in tasr
curl -i -X PUT localhost/tasr/subject/s_tmg_test_1
# register a valid version of the 's_tmg_test_1' schema
cd /
curl -i -X PUT -H "Content-Type: application/json" -d @/s_tmg_test_1.avsc localhost/tasr/subject/s_tmg_test_1/register
# tail to keep the container up, since we had to start things and run some commands after and it will exit if we don't
tail -f /dev/null
