FROM artifactory.amz.mtmemgmt.com/tasr:sandbox_v2

# Define default command
ADD s_tmg_test_1.avsc /s_tmg_test_1.avsc
RUN chown root:root /s_tmg_test_1.avsc
RUN chmod +777 /s_tmg_test_1.avsc

ADD init.sh /init.sh
RUN chown root:root /init.sh
RUN chmod +x /init.sh
ENTRYPOINT ["/init.sh"]
