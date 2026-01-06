import { ref, watch } from 'vue';
import { useParticipantIds, useAppMessage } from '@daily-co/daily-react';
import AgentVideoTile from './AgentVideoTile.jsx';
import { useAgentState } from '../../providers/AgentStateProvider.jsx';

export default {
  name: 'AgentCall',
  setup() {
    const remoteParticipantIds = useParticipantIds({ filter: 'remote' });
    const sendAppMessage = useAppMessage();
    const agentId = ref(null);
    const { hasAgentJoinedRoom, isAgentReady } = useAgentState();

    // When the agent joins the call, send a default intro message
    watch(
      () => [remoteParticipantIds.value.length, hasAgentJoinedRoom.value],
      ([participantCount, agentJoined]) => {
        if (participantCount === 1 && agentJoined && !agentId.value) {
          sendAppMessage(
            {
              event: 'chat-msg',
              message: 'hello',
              name: 'User',
            },
            '*',
          );
          agentId.value = remoteParticipantIds.value[0];
        }
      },
      { immediate: true }
    );

    return () => (
      <div className="flex h-full w-full items-center justify-center p-4 md:items-start md:px-20 md:pb-20 md:pt-20">
        {agentId.value && hasAgentJoinedRoom.value && isAgentReady.value ? (
          <div className="h-full w-full max-h-[560px] max-w-[368px] overflow-hidden rounded-lg shadow-lg">
            <AgentVideoTile id={agentId.value} />
          </div>
        ) : (
          <div
            className={`bg-dark-blue text-grey-light box-border flex h-full max-h-[560px] w-full max-w-[368px] flex-col 
              items-center justify-center rounded-lg p-6 text-center shadow-lg md:p-12`}
          >
            <h1 className="text-turquoise mb-2 text-xl font-semibold md:text-2xl">
              Waiting for agent
            </h1>
            <p className="text-grey mt-2 text-sm">
              The agent will join shortly...
            </p>
          </div>
        )}
      </div>
    );
  }
};

