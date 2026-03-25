import Script from "next/script";

const KAKAO_SDK_URL = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services&autoload=false`;

export default function KakaoScript() {
    return (
        <Script
            src={KAKAO_SDK_URL}
            strategy="beforeInteractive"
        />
    );
}
