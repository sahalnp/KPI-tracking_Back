
export const setCookie = (res, accesstoken, refreshtoken) => {
    res.cookie("accesstoken", accesstoken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
        path:"/"
    });
    res.cookie("refreshtoken", refreshtoken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path:"/"
    });
};