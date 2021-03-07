/* Copyright (c) 2017 Kaluma
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
#include <stdlib.h>
#include "uart.h"
#include "ringbuffer.h"
#include "rpi_pico.h"
#include "pico/stdlib.h"
#include "hardware/uart.h"
#include "hardware/irq.h"

#define UART0_TX_PIN    0
#define UART0_RX_PIN    1

#define UART1_TX_PIN    8
#define UART1_RX_PIN    9
#define UART1_CTS_PIN   6
#define UART1_RTS_PIN   7
static ringbuffer_t __uart_rx_ringbuffer[UART_NUM];
static uint8_t * __read_buffer[UART_NUM];
static struct __uart_status_s {
  bool enabled;
} __uart_status[UART_NUM];

static uart_inst_t *__get_uart_no(uint8_t bus) {
  if (bus == 0) {
    return uart0;
  } else if (bus == 1) {
    return uart1;
  } else {
    return NULL;
  }
}

/**
 * This function called by IRQ Handler
 */

static void __uart_fill_ringbuffer(uart_inst_t *uart, uint8_t port) {
  while (uart_is_readable(uart)) {
    uint8_t ch = uart_getc(uart);
    ringbuffer_write(&__uart_rx_ringbuffer[port], &ch, sizeof(ch));
  }
}

void __uart_irq_handler_0(void) {
  __uart_fill_ringbuffer(uart0, 0);
}

void __uart_irq_handler_1(void) {
  __uart_fill_ringbuffer(uart1, 1);
}

/**
 * Initialize all UART when system started
 */
void km_uart_init() {
  for (int i = 0; i < UART_NUM; i++)
  {
    __uart_status[i].enabled = false;
    __read_buffer[i] = NULL;
  }
}

/**
 * Cleanup all UART when system cleanup
 */
void km_uart_cleanup() {
  for (int i = 0; i < UART_NUM; i++) {
    if (__uart_status[i].enabled) {
      km_uart_close(i);
    }
  }
}

int km_uart_setup(uint8_t port, uint32_t baudrate, uint8_t bits,
    km_uart_parity_type_t parity, uint8_t stop, km_uart_flow_control_t flow,
    size_t buffer_size) {
  bool cts_en = false;
  bool rts_en = false;
  uart_parity_t pt = UART_PARITY_NONE;
  uart_inst_t *uart = __get_uart_no(port);
  if ((uart == NULL) || (__uart_status[port].enabled) || (bits < 5) || (bits > 8)) { // Can't support 9 bit
    return KM_UARTPORT_ERROR;
  }
  uart_init(uart, baudrate);
  if (port == 1) {
    if (flow & KM_UART_FLOW_RTS) {
      rts_en = true;
      gpio_set_function(UART1_RTS_PIN, GPIO_FUNC_UART);
    }
    if (flow & KM_UART_FLOW_CTS) {
      cts_en = true;
      gpio_set_function(UART1_CTS_PIN, GPIO_FUNC_UART);
    }
  }
  uart_set_hw_flow(uart, cts_en, rts_en);
  if (parity == KM_UART_PARITY_TYPE_EVEN) {
    pt = UART_PARITY_EVEN;
  } else if (parity == KM_UART_PARITY_TYPE_ODD) {
    pt = UART_PARITY_ODD;
  }
  uart_set_format(uart, bits, stop, pt);
  __read_buffer[port] = (uint8_t *)malloc(buffer_size);
  if (__read_buffer[port] == NULL) {
    return KM_UARTPORT_ERROR;
  } else {
    ringbuffer_init(&__uart_rx_ringbuffer[port], __read_buffer[port], buffer_size);
  }
  uart_set_fifo_enabled(uart, false);
  if (port == 0) {
    gpio_set_function(UART0_TX_PIN, GPIO_FUNC_UART);
    gpio_set_function(UART0_RX_PIN, GPIO_FUNC_UART);
    irq_set_exclusive_handler(UART0_IRQ , __uart_irq_handler_0);
    irq_set_enabled(UART0_IRQ, true);
  } else {
    gpio_set_function(UART1_TX_PIN, GPIO_FUNC_UART);
    gpio_set_function(UART1_RX_PIN, GPIO_FUNC_UART);
    irq_set_exclusive_handler(UART1_IRQ , __uart_irq_handler_1);
    irq_set_enabled(UART1_IRQ, true);
  }
  uart_set_irq_enables(uart, true, false);
  __uart_status[port].enabled = true;
  return 0;
}

int km_uart_write(uint8_t port, uint8_t *buf, size_t len) {
  uart_inst_t *uart = __get_uart_no(port);
  if ((uart == NULL) || (__uart_status[port].enabled == false)) {
    return KM_UARTPORT_ERROR;
  }
  uart_write_blocking(uart, (const uint8_t *)buf, len);
  return len;
}

uint32_t km_uart_available(uint8_t port) {
  uart_inst_t *uart = __get_uart_no(port);
  if ((uart == NULL) || (__uart_status[port].enabled == false)) {
    return KM_UARTPORT_ERROR;
  }
  return ringbuffer_length(&__uart_rx_ringbuffer[port]);
}

uint8_t km_uart_available_at(uint8_t port, uint32_t offset) {
  uart_inst_t *uart = __get_uart_no(port);
  if ((uart == NULL) || (__uart_status[port].enabled == false)) {
    return KM_UARTPORT_ERROR;
  }
  return ringbuffer_look_at(&__uart_rx_ringbuffer[port], offset);
}

uint32_t km_uart_buffer_size(uint8_t port) {
  uart_inst_t *uart = __get_uart_no(port);
  if ((uart == NULL) || (__uart_status[port].enabled == false)) {
    return KM_UARTPORT_ERROR;
  }
  return ringbuffer_size(&__uart_rx_ringbuffer[port]);
}

uint32_t km_uart_read(uint8_t port, uint8_t *buf, size_t len) {
  uart_inst_t *uart = __get_uart_no(port);
  if ((uart == NULL) || (__uart_status[port].enabled == false)) {
    return KM_UARTPORT_ERROR;
  }
  uint32_t n = ringbuffer_length(&__uart_rx_ringbuffer[port]);
  if (n > len) {
    n = len;
  }
  ringbuffer_read(&__uart_rx_ringbuffer[port], buf, n);
  return n;
}

int km_uart_close(uint8_t port) {
  uart_inst_t *uart = __get_uart_no(port);
  if ((uart == NULL) || (__uart_status[port].enabled == false)) {
    return KM_UARTPORT_ERROR;
  }
  if (__read_buffer[port]) {
    free(__read_buffer[port]);
    __read_buffer[port] = (uint8_t *)NULL;
  }
  uart_deinit(uart);
  __uart_status[port].enabled = false;
  return 0;
}