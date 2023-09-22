#!/bin/bash
echo "*** populating csr data ***"
echo "Executing: $@"
nohup "$@" &

while ! nc -z localhost 8081
do
    sleep 1
done

# populate csr
CSR_URL=http://localhost:8081

cd /csr

# create the 's_tmg_chat' and 's_tmg_inbox_action' subject in csr
for topic in s_tmg_chat s_tmg_inbox_action s_test s_tmg_test_1; do
  schema_prepared=$(jq @json <<< -c ./$topic.avsc)
  avro_prepared=$(cat << EOF
      {
        "schema": ${schema_prepared},
        "schemaType": "AVRO"
      }
  )
  curl -i -X POST -H "Content-Type: application/json" --data "${avro_prepared}" $CSR_URL/subjects/$topic/versions
done

# tail to keep the container up, since we had to start things and run some commands after and it will exit if we don't
tail -f /dev/null
