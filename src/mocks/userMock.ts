export const fetchMockUserId = async (
	_userName: string,
): Promise<{ user_id: string }> => {
	const mockId = "06ef3563-a450-a48c-7d03-1916360f2ee9";
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve({ user_id: mockId });
		}, 300);
	});
};
