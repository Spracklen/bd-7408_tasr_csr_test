docker build -t csr_tasr_test -f Dockerfile .
docker build -t csr_tasr_test -t artifactory.amz.mtmemgmt.com/csr_tasr_test -f Dockerfile .
docker run --net=host -e TYPE_OF_RUN="both" -e CSR_TOPIC="upsolver_csr_test" -e TASR_TOPIC="upsolver_combined_test" csr_tasr_test

docker stop $(docker ps -a -q -f ancestor=csr_tasr_test) && docker rm $(docker ps -a -q -f ancestor=csr_tasr_test)
docker rmi $(docker images -a -q -f reference=csr_tasr_test)
