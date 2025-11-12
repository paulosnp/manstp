import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, X, Loader2, Sparkles, Volume2, VolumeX, Mic, MicOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [listeningEnabled, setListeningEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [waitingForQuestion, setWaitingForQuestion] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [selectedVoice, setSelectedVoice] = useState<string>("default");
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const hasGreeted = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Buscar nome do usuário e dar boas-vindas
  useEffect(() => {
    const fetchUserAndGreet = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nome_completo')
            .eq('id', user.id)
            .single();
          
          if (profile?.nome_completo) {
            setUserName(profile.nome_completo);
            
            // Dar boas-vindas apenas uma vez por sessão
            if (!hasGreeted.current) {
              hasGreeted.current = true;
              
              // Aguardar um pouco para dar tempo do componente renderizar
              setTimeout(() => {
                const primeiroNome = profile.nome_completo.split(' ')[0];
                const greeting = `Olá ${primeiroNome}, bem-vindo ao Gestor Escolar. Como posso ajudá-lo hoje?`;
                
                speakText(greeting);
                
                setMessages([{
                  role: "assistant",
                  content: greeting
                }]);
              }, 1000);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
      }
    };

    fetchUserAndGreet();
  }, []);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true; // Melhorar sensibilidade com resultados intermediários
    recognition.maxAlternatives = 3; // Considerar mais alternativas
    
    // Ajustes para melhor sensibilidade
    if ('webkitSpeechRecognition' in window) {
      recognition.continuous = true;
    }

    recognition.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript.toLowerCase().trim();
      
      // Só processar resultados finais para evitar falsos positivos
      if (!lastResult.isFinal) return;
      
      console.log('Reconhecido (final):', transcript);

      if (transcript.includes('gestor')) {
        // Parar qualquer fala em andamento
        window.speechSynthesis.cancel();
        
        // Ativar modo de espera pela pergunta
        setWaitingForQuestion(true);
        
        if (voiceEnabled) {
          speakText('Sim, estou ouvindo.');
        }
        
        toast({
          title: "Aguardando pergunta",
          description: "Pode fazer sua pergunta agora",
        });
      } else if (waitingForQuestion && transcript.length > 5) {
        // Processar a pergunta (mínimo 5 caracteres para evitar ruído)
        setWaitingForQuestion(false);
        setInput(transcript);
        streamChat(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Erro no reconhecimento de voz:', event.error);
      
      // Ignorar erros de "no-speech" e continuar escutando
      if (event.error === 'no-speech') {
        if (listeningEnabled) {
          setTimeout(() => {
            try {
              recognition.start();
              setIsListening(true);
            } catch (err) {
              // Ignorar erro se já estiver rodando
            }
          }, 100);
        }
      } else if (event.error === 'aborted') {
        // Reiniciar após abort
        if (listeningEnabled) {
          setTimeout(() => {
            try {
              recognition.start();
              setIsListening(true);
            } catch (err) {
              // Ignorar erro se já estiver rodando
            }
          }, 100);
        }
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (listeningEnabled) {
        setTimeout(() => {
          try {
            recognition.start();
            setIsListening(true);
          } catch (err) {
            console.error('Erro ao reiniciar reconhecimento:', err);
          }
        }, 100);
      }
    };

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [listeningEnabled, voiceEnabled, waitingForQuestion]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Não suportado",
        description: "Seu navegador não suporta reconhecimento de voz",
        variant: "destructive",
      });
      return;
    }

    if (listeningEnabled) {
      recognitionRef.current.stop();
      setListeningEnabled(false);
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setListeningEnabled(true);
        setIsListening(true);
        toast({
          title: "Escuta ativada",
          description: "Diga 'Gestor' seguido da sua pergunta",
        });
      } catch (err) {
        console.error('Erro ao iniciar reconhecimento:', err);
        toast({
          title: "Erro",
          description: "Não foi possível ativar a escuta",
          variant: "destructive",
        });
      }
    }
  };

  const speakText = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    
    // Remove markdown formatting for cleaner speech
    const cleanText = text
      .replace(/\*\*/g, '') // Remove bold markers
      .replace(/\*/g, '')   // Remove italic markers
      .replace(/#{1,6}\s/g, '') // Remove heading markers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/`{1,3}/g, '') // Remove code markers
      .replace(/[-•]\s/g, '') // Remove bullet points
      .replace(/\n{2,}/g, '. ') // Replace multiple newlines with period
      .replace(/\n/g, ' '); // Replace single newlines with space
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    
    // Configurar voz baseada na seleção
    const voices = window.speechSynthesis.getVoices();
    const ptBrVoices = voices.filter(v => v.lang.startsWith('pt-BR') || v.lang.startsWith('pt'));
    
    if (selectedVoice === "female" && ptBrVoices.length > 0) {
      // Tentar encontrar voz feminina (geralmente tem "female" ou nomes femininos)
      const femaleVoice = ptBrVoices.find(v => 
        v.name.toLowerCase().includes('female') || 
        v.name.toLowerCase().includes('luciana') ||
        v.name.toLowerCase().includes('maria')
      ) || ptBrVoices[0];
      utterance.voice = femaleVoice;
    } else if (selectedVoice === "male" && ptBrVoices.length > 1) {
      // Tentar encontrar voz masculina
      const maleVoice = ptBrVoices.find(v => 
        v.name.toLowerCase().includes('male') ||
        v.name.toLowerCase().includes('felipe') ||
        v.name.toLowerCase().includes('daniel')
      ) || ptBrVoices[1] || ptBrVoices[0];
      utterance.voice = maleVoice;
    } else if (selectedVoice === "neutral" && ptBrVoices.length > 2) {
      // Usar terceira voz disponível ou primeira
      utterance.voice = ptBrVoices[2] || ptBrVoices[0];
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    window.speechSynthesis.speak(utterance);
  };

  const streamChat = async (userMessage: string) => {
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: newMessages }),
        }
      );

      if (!response.ok || !response.body) {
        if (response.status === 429) {
          toast({
            title: "Limite atingido",
            description: "Muitas requisições. Aguarde alguns momentos.",
            variant: "destructive",
          });
        } else if (response.status === 402) {
          toast({
            title: "Créditos esgotados",
            description: "Adicione créditos no workspace Lovable.",
            variant: "destructive",
          });
        } else {
          throw new Error("Falha ao conectar com assistente");
        }
        setIsLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantMessage = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              setMessages([
                ...newMessages,
                { role: "assistant", content: assistantMessage },
              ]);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (assistantMessage && voiceEnabled) {
        speakText(assistantMessage);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Erro no chat:", error);
      toast({
        title: "Erro",
        description: "Não foi possível conectar ao assistente de IA",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    streamChat(input.trim());
    setInput("");
  };

  const suggestedQuestions = [
    "Quantos alunos estão em andamento?",
    "Quais cursos têm mais alunos?",
    "Mostre estatísticas gerais do sistema",
    "Que relatórios você pode gerar?",
  ];

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform bg-primary"
          size="icon"
          data-tour="ai-assistant"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[400px] h-[600px] shadow-2xl flex flex-col z-50">
          <CardHeader className="bg-primary text-primary-foreground flex flex-row items-center justify-between py-3 px-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <CardTitle className="text-base">Assistente IA</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="h-8 px-2 text-xs bg-primary-foreground/10 border-none rounded hover:bg-primary-foreground/20 cursor-pointer"
                title="Selecionar voz"
              >
                <option value="default">Voz Padrão</option>
                <option value="female">Voz Feminina</option>
                <option value="male">Voz Masculina</option>
                <option value="neutral">Voz Neutra</option>
              </select>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleListening}
                className={`h-8 w-8 hover:bg-primary-foreground/20 ${waitingForQuestion ? 'bg-green-500/20' : isListening ? 'bg-red-500/20' : ''}`}
                title={listeningEnabled ? "Desativar escuta de voz" : "Ativar escuta de voz (diga 'Gestor')"}
              >
                {listeningEnabled ? (
                  <Mic className={`h-4 w-4 ${waitingForQuestion ? 'text-green-500 animate-pulse' : isListening ? 'text-red-500 animate-pulse' : ''}`} />
                ) : (
                  <MicOff className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setVoiceEnabled(!voiceEnabled);
                  if (voiceEnabled) {
                    window.speechSynthesis.cancel();
                  }
                }}
                className="h-8 w-8 hover:bg-primary-foreground/20"
                title={voiceEnabled ? "Desativar voz" : "Ativar voz"}
              >
                {voiceEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 hover:bg-primary-foreground/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    Olá! Sou seu assistente inteligente. Posso ajudar com:
                  </p>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Estatísticas de alunos e cursos</li>
                    <li>• Análise de dados do sistema</li>
                    <li>• Sugestões de relatórios</li>
                    <li>• Insights sobre desempenho</li>
                  </ul>
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-medium">Perguntas sugeridas:</p>
                    {suggestedQuestions.map((q, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs h-auto py-2 whitespace-normal text-left"
                        onClick={() => {
                          setInput(q);
                          streamChat(q);
                        }}
                        disabled={isLoading}
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-4 ${
                    msg.role === "user" ? "text-right" : "text-left"
                  }`}
                >
                  <div
                    className={`inline-block max-w-[80%] p-3 rounded-lg text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="text-left mb-4">
                  <div className="inline-block bg-muted p-3 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </ScrollArea>

            <form
              onSubmit={handleSubmit}
              className="p-4 border-t flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua pergunta..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
};
