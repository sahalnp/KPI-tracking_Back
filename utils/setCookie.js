
// export const setCookie = (res, accesstoken, refreshtoken) => {
//     res.cookie("accesstoken", accesstoken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "strict",
//         maxAge: 15 * 60 * 1000,
//         path:"/"
//     });
//     res.cookie("refreshtoken", refreshtoken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "strict",
//         maxAge: 7 * 24 * 60 * 60 * 1000,
//         path:"/"
//     });
// };



export const setCookie = (res, accesstoken, refreshtoken) => {
  const isProd = process.env.NODE_ENV === "production";

  res.cookie("accesstoken", accesstoken, {
    httpOnly: true,
    secure: isProd,            // must be true if sameSite = "none"
    sameSite: isProd ? "none" : "lax", 
    maxAge: 15 * 60 * 1000,
    path: "/"
  });

  res.cookie("refreshtoken", refreshtoken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/"
  });
};
