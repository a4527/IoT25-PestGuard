include <TensorFlowLite.h>
2.	#include "model.h"  // Edge Impulse에서 export한 tflite 모델
3.	#include "edge-impulse-sdk/classifier/ei_run_classifier.h"
4.	
5.	#define BUFFER_SIZE 16000  // 1초간 16kHz 샘플링
6.	int16_t audioBuffer[BUFFER_SIZE];
7.	
8.	// INMP441 설정 (I2S 마이크용)
9.	void setupI2S() {
10.	  const i2s_config_t i2s_config = {
11.	    .mode = i2s_mode_t(I2S_MODE_MASTER | I2S_MODE_RX),
12.	    .sample_rate = 16000,
13.	    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
14.	    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
15.	    .communication_format = I2S_COMM_FORMAT_I2S,
16.	    .intr_alloc_flags = 0,
17.	    .dma_buf_count = 4,
18.	    .dma_buf_len = 1024,
19.	    .use_apll = false
20.	  };
21.	
22.	  const i2s_pin_config_t pin_config = {
23.	    .bck_io_num = 26,
24.	    .ws_io_num = 25,
25.	    .data_out_num = -1,
26.	    .data_in_num = 33
27.	  };
28.	
29.	  i2s_driver_install(I2S_NUM_0, &i2s_config, 0, NULL);
30.	  i2s_set_pin(I2S_NUM_0, &pin_config);
31.	  i2s_zero_dma_buffer(I2S_NUM_0);
32.	}
33.	
34.	void setup() {
35.	  Serial.begin(115200);
36.	  setupI2S();
37.	  ei_printf("Ready to record and classify...\n");
38.	}
39.	
40.	void loop() {
41.	  size_t bytesRead;
42.	  i2s_read(I2S_NUM_0, (void*)audioBuffer, BUFFER_SIZE * sizeof(int16_t), &bytesRead, portMAX_DELAY);
43.	
44.	  // Edge Impulse Classifier API 사용
45.	  signal_t signal;
46.	  int err = numpy::signal_from_buffer(audioBuffer, BUFFER_SIZE, &signal);
47.	  if (err != 0) {
48.	    ei_printf("Signal error: %d\n", err);
49.	    return;
50.	  }
51.	
52.	  ei_impulse_result_t result = { 0 };
53.	  EI_IMPULSE_ERROR res = run_classifier(&signal, &result, false);
54.	  if (res != EI_IMPULSE_OK) {
55.	    ei_printf("Classification failed: %d\n", res);
56.	    return;
57.	  }
58.	
59.	  // 결과 출력
60.	  for (size_t ix = 0; ix < result.classification->size; ix++) {
61.	    ei_printf("%s: %.2f\n", result.classification->at(ix).label,
62.	              result.classification->at(ix).value);
63.	  }
64.	
65.	  delay(1000);
66.	}
67.	
