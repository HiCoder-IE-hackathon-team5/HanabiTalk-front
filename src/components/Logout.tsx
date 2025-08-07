import React from "react";
import { useNavigate } from "react-router-dom";
import { deleteCookie, getCookie } from "../utils/cookie";
import { logoutUser } from "../utils/api";

// props: React.ButtonHTMLAttributes<HTMLButtonElement>型を受け取る
const Logout: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => {
	const navigate = useNavigate();

	const handleLogout = async () => {
		const roomName = getCookie("room_name") || "";
		const userId = getCookie("user_id") || "";

		const success = await logoutUser(roomName, userId);

		if (success) {
			deleteCookie("user_name");
			deleteCookie("room_name");
			deleteCookie("user_id");

			navigate("/login");
		} else {
			alert("ログアウトに失敗しました");
		}
	};

	return (
		<button
			{...props} // styleやclassNameなどを親から受け取れる
			onClick={handleLogout}
		>
			ログアウト
		</button>
	);
};

export default Logout;