import { DailyVideo } from '@daily-co/daily-react';

export default {
  name: 'AgentVideoTile',
  props: {
    id: {
      type: String,
      required: true
    }
  },
  setup(props) {
    return () => (
      <div className="relative h-full w-full overflow-hidden rounded-lg">
        <DailyVideo
          sessionId={props.id}
          type="video"
          className="h-full w-full object-cover"
          fit="cover"
        />
      </div>
    );
  }
};
