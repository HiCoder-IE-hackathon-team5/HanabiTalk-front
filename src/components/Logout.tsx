import React from "react";
import { useNavigate } from "react-router-dom";
import { deleteCookie, getCookie } from "../utils/cookie";
import { logoutUser } from "../utils/api";

const Logout: React.FC = () => {
	const navigate = useNavigate();

	const handleLogout = async () => {
		const roomName = getCookie("room_name") || "";
		const userId = getCookie("user_id") || "";

		const success = await logoutUser(roomName, userId);

		if (success) {
			// Cookie削除
			deleteCookie("user_name");
			deleteCookie("room_name");
			deleteCookie("user_id");

			navigate("/login");
		} else {
			alert("ログアウトに失敗しました");
		}
	};

	return <button onClick={handleLogout}>ログアウト</button>;
};

export default Logout;
