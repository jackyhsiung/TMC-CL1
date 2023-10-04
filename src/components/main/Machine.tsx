import { Box, Image, Flex, HStack, Center } from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import * as Tone from "tone";

import artists from "@/dummy/artists";
import pads from "@/dummy/pads";

import PadLight from "@/components/machine/PadLight";
import RecordingLight from "@/components/machine/RecordingLight";

interface MachineProps {
  isMenuOpen: boolean;
}
interface LooseObject {
  [key: string]: any;
}

const Machine = ({ isMenuOpen }: MachineProps) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isToneStarted, setIsToneStarted] = useState<boolean>(false);
  const [currentSeq, setCurrentSeq] = useState(1);
  const [insertGif, setInsetGif] = useState<string>("");
  const [activePad, setActivePad] = useState<string>("");
  const [isJamming, setIsJamming] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const router = useRouter();
  const pathName = router.pathname.split("/")[2];

  // dummy data 後處理
  const padsArr = Object.values(pads).sort((a, b) => a.id - b.id);
  const curSeqData = artists[pathName]?.[`seq${currentSeq}`];

  const playerRef = useRef<any>(null);

  const handler = {
    initiateTone: async () => {
      await Tone.loaded();
      await Tone.start();
      setIsToneStarted(true);
    },
    createNewLoopedAndSyncedPlayer: (src: string) => {
      const newPlayer = new Tone.Player(src).toDestination();
      newPlayer.loop = true;
      newPlayer.volume.value = -10;
      newPlayer.sync();
      return newPlayer;
    },
    createPlayers: () => {
      const { src, srcJam } = curSeqData.audios.seqAudio;
      const samplesAudios = curSeqData.audios.sampleAudios;
      const fullPlayer = handler.createNewLoopedAndSyncedPlayer(src);
      const jamPlayer = handler.createNewLoopedAndSyncedPlayer(srcJam);
      const samplePlayers = samplesAudios.map((sampleAudio: LooseObject) =>
        new Tone.Player(sampleAudio.src).toDestination()
      );
      return { fullPlayer, jamPlayer, samplePlayers };
    },
    setJam: (isJamming: boolean) => {
      const { fullPlayer, jamPlayer } = playerRef.current;
      fullPlayer.mute = isJamming;
      jamPlayer.mute = !isJamming;
    },
    toggleJam: () => {
      const { fullPlayer, jamPlayer } = playerRef.current;
      fullPlayer.mute = !isJamming;
      jamPlayer.mute = isJamming
    },
    onChangeGif: (curGifData: { [key: string]: any }) => {
      if (!curGifData?.src) return;
      // if (insertGif !== "") setInsetGif("");
      setInsetGif(curGifData.src);
      setTimeout(() => {
        setInsetGif("");
      }, curGifData.duration);
    },
    onChangePadLight: (padName: string) => {
      if (activePad !== "") setActivePad("");
      setActivePad(padName);
      setTimeout(() => {
        setActivePad("");
      }, 100);
    },
    onPadTouch: (padName: string) => {
      const padNum = parseInt(padName);
      if (!padNum) return;

      const curGifData = curSeqData.padGifs[padNum - 1];
      handler.onChangeGif(curGifData);
      handler.onChangePadLight(padName);

      const { samplePlayers } = playerRef.current;
      try {
        samplePlayers[padNum - 1].start();
      } catch (err) {
        console.log(err);
      }
    },
    onPlayOrPause: async () => {
      if (!isPlaying) {
        await Tone.loaded();
        Tone.Transport.start();
        setIsPlaying(true);
      } else {
        Tone.Transport.pause();
        setIsPlaying(false);
      }
    },
  };

  useEffect(() => {
    // 判斷使用者裝置
    const userAgent = navigator.userAgent;
    const mobileKeywords = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i;
    setIsMobile(mobileKeywords.test(userAgent));

    // 初始化 Tone
    handler.initiateTone();

    // 初始化 playerRef
    playerRef.current = handler.createPlayers();
  }, []);

  useEffect(() => {
    if (isToneStarted && playerRef.current) {
      const { bpm } = curSeqData.audios.seqAudio;
      Tone.Transport.bpm.value = bpm;
      const { fullPlayer, jamPlayer } = playerRef.current;
      handler.setJam(isJamming);
      fullPlayer.start(0);
      jamPlayer.start(0);
    }
  }, [isToneStarted, playerRef.current]);

  return (
    <Box
      // 外層容器
      pos="absolute"
      overflow="hidden"
      w="100%"
      borderRadius="8px"
      top={isMenuOpen ? "700px" : "100px"}
      zIndex="7999"
      transition="all 0.3s ease-out"
      transitionDelay={isMenuOpen ? "0s" : "0.3s"}
      transitionDuration={isMenuOpen ? "0.3s" : "0.7s"}
      boxShadow="rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgb(0, 0, 0,0.5) 0px 35px 60px -15px"
    >
      <Box
        // 機器背景
        h="100%"
        w="100%"
        bgImage={{
          base: "/images/small-machine.png",
          sm: "/images/big-machine.png",
        }}
        bgSize="contain"
        bgRepeat="no-repeat"
        bgPosition="center"
      >
        <Flex
          // 機器內容
          direction="column"
          p="20px 20px 15px 15px"
          h="100%"
          gap="15px"
        >
          <Flex
            // 螢幕容器
            direction="column"
            border="3px solid black"
            w="100%"
            h={{ base: "182px", sm: "91vw" }}
            maxH="382px"
            borderRadius="8px"
            bgColor="rgb(197, 218, 227)"
            pt="12px"
            px="8px"
            pb="1px"
            justify="space-between"
          >
            <HStack
              // SEQs
              spacing="6px"
            >
              {[1, 2, 3, 4].map((seq) => (
                <Center
                  flex="1"
                  key={seq}
                  bgColor={currentSeq === seq ? "#292929" : "#687074"}
                  color="white"
                  textStyle="en_special_md_bold"
                  cursor="pointer"
                  onClick={() => setCurrentSeq(seq)}
                >
                  SEQ.{seq}
                </Center>
              ))}
            </HStack>

            <Box pos="relative">
              {/* Jam */}
              <Image
                pos="absolute"
                top="0"
                right="0"
                w="85px"
                src={isJamming ? "/images/jam_on.png" : "/images/jam_off.png"}
                cursor="pointer"
                onClick={() => {
                  handler.toggleJam();
                  setIsJamming((prev) => !prev);
                }}
              />

              {/* Gif */}
              <Image
                w="100%"
                maxH={{ base: "100px", sm: "unset" }}
                src={insertGif || curSeqData["waitGif"]}
              />
            </Box>

            <Flex
              // 功能按鈕區
              pl="12px"
              justify="space-between"
            >
              <HStack
                color="#4D4D4D"
                spacing="18px"
                textStyle="en_special_md_bold"
              >
                {["FX", "SAMPLE"].map((buttonLabel) => (
                  <Box key={buttonLabel} bgColor="#EBEBEB" p="2px 16px">
                    {buttonLabel}
                  </Box>
                ))}
              </HStack>
              <HStack>
                <Image
                  src="/images/restart.svg"
                  alt="restart"
                  cursor="pointer"
                />
                <Box cursor="pointer" onClick={handler.onPlayOrPause}>
                  {isPlaying ? (
                    <Image src="/images/pause.svg" alt="pause" />
                  ) : (
                    <Image src="/images/play.svg" alt="play" />
                  )}
                </Box>
              </HStack>
            </Flex>
          </Flex>

          <HStack
            // 按鈕
            spacing="4px"
          >
            <Image
              w={{ base: "80px", sm: "21.5vw" }}
              maxW="90px"
              src="/images/bbbb.png"
              cursor="pointer"
            />
            <Image
              w={{ base: "80px", sm: "21.5vw" }}
              maxW="90px"
              src="/images/bbbb.png"
              cursor="pointer"
            />
          </HStack>

          <Box
            // Pad區
            p="2px"
            bgColor="black"
            w="100%"
            borderRadius="8px"
          >
            <Flex wrap="wrap">
              {padsArr.map((pad) => (
                <Box
                  key={pad.id}
                  pos="relative"
                  p="2px"
                  w="25%"
                  onClick={() => {
                    handler.onPadTouch(pad.name);
                  }}
                >
                  <PadLight myPadName={pad.name} activePad={activePad} />
                  {pad.id < 5 && <RecordingLight />}
                  <Image src={pad.imageSrc} alt={pad.name} cursor="pointer" />
                </Box>
              ))}
            </Flex>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

export default Machine;
