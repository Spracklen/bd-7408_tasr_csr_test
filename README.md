docker build -t csr_tasr_test Dockerfile .
docker build -t csr_tasr_test -t artifactory.amz.mtmemgmt.com/csr_tasr_test -f Dockerfile .
docker run --net=host csr_tasr_test

docker stop $(docker ps -a -q -f ancestor=csr_tasr_test) && docker rm $(docker ps -a -q -f ancestor=csr_tasr_test)
docker rmi $(docker images -a -q -f reference=csr_tasr_test)
