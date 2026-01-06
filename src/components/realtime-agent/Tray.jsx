import { useAudioTrack, useDaily, useLocalSessionId, useAppMessage } from '@daily-co/daily-react';

export default {
  name: 'Tray',
  props: {
    leaveCall: {
      type: Function,
      required: true
    },
    toggleChat: {
      type: Function,
      default: null
    },
    showChat: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const callObject = useDaily();
    const localSessionId = useLocalSessionId();
    const localAudio = useAudioTrack(localSessionId);
    const mutedAudio = localAudio?.isOff || false;

    const toggleAudio = () => {
      callObject.setLocalAudio(mutedAudio);
    };

    return () => (
      <div
        className={`bg-dark-blue text-darkest-blue border-dark-blue-border fixed bottom-0
          left-0 flex w-full flex-col border-t z-50`}
      >
        <div className="flex p-4">
          <div className="flex flex-1 items-center justify-center gap-6">
            <button
              onClick={toggleAudio}
              type="button"
              className={`bg-turquoise hover:bg-turquoise-hover text-darkest-blue flex cursor-pointer flex-col 
                items-center rounded-lg px-4 py-2 font-normal transition-colors duration-200`}
            >
              <span>{mutedAudio ? '🔇' : '🎤'}</span>
              <span className="text-xs">
                {mutedAudio ? 'Unmute mic' : 'Mute mic'}
              </span>
            </button>

            <button
              onClick={props.leaveCall}
              type="button"
              className={`bg-turquoise hover:bg-turquoise-hover text-darkest-blue flex cursor-pointer flex-col
                items-center rounded-lg px-4 py-2 font-normal transition-colors duration-200`}
            >
              <span>📞</span>
              <span className="text-xs">Leave call</span>
            </button>
            {props.toggleChat && (
              <button
                onClick={props.toggleChat}
                type="button"
                className={`bg-turquoise hover:bg-turquoise-hover text-darkest-blue flex cursor-pointer flex-col
                items-center rounded-lg px-4 py-2 font-normal transition-colors duration-200 md:hidden`}
              >
                <span>💬</span>
                <span className="text-xs">{props.showChat ? 'Hide Chat' : 'Chat'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
};
