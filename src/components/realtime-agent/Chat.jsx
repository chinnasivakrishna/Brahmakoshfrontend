import { ref, watch } from 'vue';
import { useAppMessage } from '@daily-co/daily-react';

export default {
  name: 'Chat',
  props: {
    showChat: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const messages = ref([]);
    const inputValue = ref('');
    const sendAppMessage = useAppMessage();

    const sendMessage = (message) => {
      sendAppMessage(
        {
          event: 'chat-msg',
          message: message,
          name: 'User',
        },
        '*',
      );

      messages.value = [
        ...messages.value,
        {
          msg: message,
          name: 'User',
        },
      ];
    };

    const handleChange = (e) => {
      inputValue.value = e.target.value;
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!inputValue.value.trim()) return;
      sendMessage(inputValue.value);
      inputValue.value = '';
    };

    // Listen for agent messages via app-message events
    // This would need to be handled in the parent component
    
    return () => (
      <aside
        className={`bg-dark-blue border-dark-blue-border text-grey-light 
          ${props.showChat ? 'flex h-[50%] w-full' : 'hidden md:flex md:w-[300px]'}
          md:fixed md:bottom-[81px] md:right-0 md:top-0 flex-col justify-end overflow-y-auto md:border-l border-t md:border-t-0 pb-[81px] md:pb-0`}
      >
        <div className="border-dark-blue-border border-b px-4 py-3">
          <h2 className="text-turquoise m-0 text-lg font-semibold">Messages</h2>
        </div>
        <ul className="m-0 h-full space-y-3 overflow-y-auto p-4">
          {messages.value.map((message, index) => (
            <li key={`message-${index}`} className="list-none">
              <div className="flex flex-col gap-1">
                <span className="text-turquoise text-sm font-semibold">
                  {message?.name}
                </span>
                <p className="text-grey-light m-0 text-left text-sm leading-relaxed">
                  {message?.msg}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="p-4">
          <form className="flex items-center gap-2" onSubmit={handleSubmit}>
            <input
              className={`text-darkest-blue ring-turquoise bg-grey-light flex-grow rounded-lg border-0
                px-3 py-2 text-sm outline-none ring-2`}
              type="text"
              placeholder="Message"
              value={inputValue.value}
              onInput={handleChange}
            />
            <button
              type="submit"
              className={`bg-turquoise hover:bg-turquoise-hover text-darkest-blue flex cursor-pointer
                items-center justify-center rounded-lg border-0 p-3 transition-colors duration-200`}
            >
              ➤
            </button>
          </form>
        </div>
      </aside>
    );
  }
};

