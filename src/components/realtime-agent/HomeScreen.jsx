export default {
  name: 'HomeScreen',
  props: {
    createCall: {
      type: Function,
      required: true
    },
    creatingRoom: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const startDemo = () => {
      props.createCall();
    };

    return () => (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center px-4 pt-16 text-center">
        <h1 className="text-grey-light mb-4 text-4xl font-bold">
          Real-Time Agent
        </h1>
        <p className="text-grey-light mb-8 max-w-md text-lg">
          Connect to the AI agent by clicking the button below to start a conversation.
        </p>
        <button
          onClick={startDemo}
          type="button"
          disabled={props.creatingRoom}
          className={`bg-turquoise hover:bg-turquoise-hover text-darkest-blue focus:ring-turquoise 
            focus:ring-offset-darkest-blue flex cursor-pointer items-center gap-2 rounded-lg 
            px-6 py-3 text-sm font-semibold shadow-md transition-colors duration-200 focus:outline-none 
            focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70`}
        >
          {props.creatingRoom ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <span>Joining room...</span>
            </>
          ) : (
            "Talk to Agent"
          )}
        </button>
      </div>
    );
  }
};
