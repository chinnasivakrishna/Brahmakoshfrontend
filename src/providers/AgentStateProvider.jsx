import { provide, inject, ref } from 'vue';

const AgentStateSymbol = Symbol('agentState');

export function AgentStateProvider({ children, ...props }) {
  const hasAgentJoinedRoom = ref(false);
  const isAgentReady = ref(false);

  const state = {
    hasAgentJoinedRoom,
    isAgentReady,
    setHasAgentJoinedRoom: (value) => {
      hasAgentJoinedRoom.value = value;
    },
    setIsAgentReady: (value) => {
      isAgentReady.value = value;
    },
  };

  provide(AgentStateSymbol, state);

  return children;
}

export function useAgentState() {
  const state = inject(AgentStateSymbol);
  if (!state) {
    throw new Error('useAgentState must be used within an AgentStateProvider');
  }
  return state;
}
