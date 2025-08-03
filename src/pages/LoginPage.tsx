import CreateRoomForm from "../components/CreateRoomForm";
import EnterRoomForm from "../components/EnterRoomForm";
import RoomList from "../components/RoomList";

const LoginPage = () => {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>HanabiTalk - ログイン</h1>
      <CreateRoomForm />
      <EnterRoomForm />
      <RoomList />
    </div>
  );
};

export default LoginPage;